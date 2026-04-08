"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

// Indian Public Holidays for all 12 months (2026)
const INDIAN_HOLIDAYS: Record<string, string> = {
  // January
  "2026-01-01": "New Year's Day",
  "2026-01-14": "Makar Sankranti",
  "2026-01-26": "Republic Day",
  // February
  "2026-02-19": "Shivaji Jayanti",
  "2026-02-26": "Maha Shivaratri",
  // March
  "2026-03-10": "Holi",
  "2026-03-17": "Holika Dahan",
  "2026-03-30": "Ugadi",
  // April
  "2026-04-02": "Good Friday",
  "2026-04-06": "Ram Navami",
  "2026-04-14": "Ambedkar Jayanti",
  "2026-04-21": "Mahavir Jayanti",
  // May
  "2026-05-01": "May Day",
  "2026-05-07": "Buddha Purnima",
  "2026-05-25": "Eid ul-Fitr",
  // June
  "2026-06-21": "International Yoga Day",
  // July
  "2026-07-06": "Rath Yatra",
  "2026-07-31": "Eid ul-Adha",
  // August
  "2026-08-03": "Raksha Bandhan",
  "2026-08-11": "Janmashtami",
  "2026-08-15": "Independence Day",
  "2026-08-20": "Muharram",
  // September
  "2026-09-05": "Teachers Day",
  // October
  "2026-10-02": "Gandhi Jayanti",
  "2026-10-20": "Dussehra",
  "2026-10-29": "Milad un-Nabi",
  // November
  "2026-11-07": "Diwali",
  "2026-11-08": "Diwali Holiday",
  "2026-11-09": "Govardhan Puja",
  "2026-11-14": "Children's Day",
  "2026-11-15": "Guru Nanak Jayanti",
  // December
  "2026-12-25": "Christmas",
}

// Season info based on month
const SEASON_INFO: Record<number, { emoji: string; label: string }> = {
  0: { emoji: "❄️", label: "Winter" },
  1: { emoji: "❄️", label: "Winter" },
  2: { emoji: "🌸", label: "Spring" },
  3: { emoji: "🌸", label: "Spring" },
  4: { emoji: "☀️", label: "Summer" },
  5: { emoji: "☀️", label: "Summer" },
  6: { emoji: "🌧️", label: "Monsoon" },
  7: { emoji: "🌧️", label: "Monsoon" },
  8: { emoji: "🌧️", label: "Monsoon" },
  9: { emoji: "🍂", label: "Autumn" },
  10: { emoji: "🍂", label: "Autumn" },
  11: { emoji: "❄️", label: "Winter" },
}

// Month hero images from Unsplash
const MONTH_IMAGES: Record<number, string> = {
  0: "https://images.unsplash.com/photo-1483664852095-d6cc6870702d?w=800&q=80",
  1: "https://images.unsplash.com/photo-1486578077620-8a022100d4b1?w=800&q=80",
  2: "https://images.unsplash.com/photo-1462275646964-a0e3386b89fa?w=800&q=80",
  3: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&q=80",
  4: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
  5: "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=800&q=80",
  6: "https://images.unsplash.com/photo-1428592953211-077101b2021b?w=800&q=80",
  7: "https://images.unsplash.com/photo-1501691223387-dd0500403074?w=800&q=80",
  8: "https://images.unsplash.com/photo-1505144808419-1957a94ca61e?w=800&q=80",
  9: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
  10: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&q=80",
  11: "https://images.unsplash.com/photo-1482442120256-9c03866de390?w=800&q=80",
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

interface DateRange {
  start: Date | null
  end: Date | null
}

export default function WallCalendar() {
  // All state initialized with safe static defaults (no Date calls)
  const [mounted, setMounted] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(0)
  const [currentYear, setCurrentYear] = useState(2026)
  const [todayString, setTodayString] = useState("")
  const [dateRange, setDateRange] = useState<DateRange>({ start: null, end: null })
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null)
  const [notes, setNotes] = useState("")
  const [savedNotes, setSavedNotes] = useState<Record<string, string>>({})
  const [isAnimating, setIsAnimating] = useState(false)
  const [animationDirection, setAnimationDirection] = useState<"left" | "right">("right")
  const [showSaved, setShowSaved] = useState(false)
  const [tooltipInfo, setTooltipInfo] = useState<{ x: number; y: number; text: string } | null>(null)

  // Use a ref to track savedNotes without triggering re-renders for notes loading
  const savedNotesRef = useRef<Record<string, string>>({})

  // Single useEffect to initialize all date-dependent and localStorage values on client only
  useEffect(() => {
    const now = new Date()
    const month = now.getMonth()
    const year = now.getFullYear()
    
    setCurrentMonth(month)
    setCurrentYear(year)
    setTodayString(now.toDateString())
    
    // Load saved notes from localStorage
    try {
      const stored = localStorage.getItem("calendar-notes")
      if (stored) {
        const parsed = JSON.parse(stored)
        setSavedNotes(parsed)
        savedNotesRef.current = parsed
        const key = `${year}-${month}`
        if (parsed[key]) {
          setNotes(parsed[key])
        }
      }
    } catch {
      // Ignore localStorage errors
    }
    
    setMounted(true)
  }, [])

  // Load notes when month changes (only after mounted)
  // Use the ref to get savedNotes to avoid dependency on savedNotes state
  useEffect(() => {
    if (!mounted) return
    const key = `${currentYear}-${currentMonth}`
    setNotes(savedNotesRef.current[key] || "")
  }, [currentMonth, currentYear, mounted])

  // Memoized calendar days calculation - trim trailing rows of only next-month dates
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay = new Date(currentYear, currentMonth + 1, 0)
    const startingDay = firstDay.getDay()
    const totalDays = lastDay.getDate()
    
    const days: Array<{ date: Date; isCurrentMonth: boolean }> = []
    
    // Previous month days
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate()
    for (let i = startingDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(currentYear, currentMonth - 1, prevMonthLastDay - i),
        isCurrentMonth: false
      })
    }
    
    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      days.push({
        date: new Date(currentYear, currentMonth, i),
        isCurrentMonth: true
      })
    }
    
    // Calculate how many rows we need (minimum to show all current month dates)
    const totalCells = days.length
    const rowsNeeded = Math.ceil(totalCells / 7)
    const cellsNeeded = rowsNeeded * 7
    
    // Next month days to complete the grid (only as many as needed)
    const remainingDays = cellsNeeded - totalCells
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(currentYear, currentMonth + 1, i),
        isCurrentMonth: false
      })
    }
    
    return days
  }, [currentMonth, currentYear])

  const formatDateKey = useCallback((date: Date): string => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const d = String(date.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
  }, [])

  const isToday = useCallback((date: Date): boolean => {
    return mounted && date.toDateString() === todayString
  }, [mounted, todayString])

  const isInRange = useCallback((date: Date): boolean => {
    if (!dateRange.start || !dateRange.end) return false
    return date > dateRange.start && date < dateRange.end
  }, [dateRange])

  const isRangeStart = useCallback((date: Date): boolean => {
    if (!dateRange.start) return false
    return date.toDateString() === dateRange.start.toDateString()
  }, [dateRange.start])

  const isRangeEnd = useCallback((date: Date): boolean => {
    if (!dateRange.end) return false
    return date.toDateString() === dateRange.end.toDateString()
  }, [dateRange.end])

  const isInPreviewRange = useCallback((date: Date): boolean => {
    if (!dateRange.start || dateRange.end || !hoveredDate) return false
    const start = dateRange.start < hoveredDate ? dateRange.start : hoveredDate
    const end = dateRange.start < hoveredDate ? hoveredDate : dateRange.start
    return date > start && date < end
  }, [dateRange, hoveredDate])

  const isPreviewEnd = useCallback((date: Date): boolean => {
    if (!dateRange.start || dateRange.end || !hoveredDate) return false
    return date.toDateString() === hoveredDate.toDateString()
  }, [dateRange, hoveredDate])

  // Check if date is at start of a row (Sunday)
  const isRowStart = useCallback((index: number): boolean => {
    return index % 7 === 0
  }, [])

  // Check if date is at end of a row (Saturday)
  const isRowEnd = useCallback((index: number): boolean => {
    return index % 7 === 6
  }, [])

  const handleDateClick = useCallback((date: Date) => {
    if (!dateRange.start || dateRange.end) {
      // Start new selection
      setDateRange({ start: date, end: null })
    } else {
      // Complete selection
      if (date < dateRange.start) {
        setDateRange({ start: date, end: dateRange.start })
      } else if (date.toDateString() === dateRange.start.toDateString()) {
        // Clicking same date resets
        setDateRange({ start: null, end: null })
      } else {
        setDateRange({ start: dateRange.start, end: date })
      }
    }
  }, [dateRange])

  const handleMouseEnter = useCallback((date: Date) => {
    if (dateRange.start && !dateRange.end) {
      setHoveredDate(date)
    }
  }, [dateRange])

  const handleMouseLeave = useCallback(() => {
    setHoveredDate(null)
  }, [])

  const navigateMonth = useCallback((direction: "prev" | "next") => {
    if (isAnimating) return
    setAnimationDirection(direction === "next" ? "left" : "right")
    setIsAnimating(true)
    
    setTimeout(() => {
      if (direction === "prev") {
        if (currentMonth === 0) {
          setCurrentMonth(11)
          setCurrentYear(y => y - 1)
        } else {
          setCurrentMonth(m => m - 1)
        }
      } else {
        if (currentMonth === 11) {
          setCurrentMonth(0)
          setCurrentYear(y => y + 1)
        } else {
          setCurrentMonth(m => m + 1)
        }
      }
      setIsAnimating(false)
    }, 300)
  }, [currentMonth, isAnimating])

  const saveNotes = useCallback(() => {
    const key = `${currentYear}-${currentMonth}`
    const updated = { ...savedNotes, [key]: notes }
    setSavedNotes(updated)
    savedNotesRef.current = updated
    try {
      localStorage.setItem("calendar-notes", JSON.stringify(updated))
    } catch {
      // Ignore localStorage errors
    }
    setShowSaved(true)
    setTimeout(() => setShowSaved(false), 2000)
  }, [currentMonth, currentYear, notes, savedNotes])

  const getHoliday = useCallback((date: Date): string | null => {
    return INDIAN_HOLIDAYS[formatDateKey(date)] || null
  }, [formatDateKey])

  const handleHolidayHover = useCallback((e: React.MouseEvent, holiday: string) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    setTooltipInfo({
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
      text: holiday
    })
  }, [])

  const handleHolidayLeave = useCallback(() => {
    setTooltipInfo(null)
  }, [])

  // Format range summary with arrow notation
  const formatRange = useMemo(() => {
    if (!mounted || !dateRange.start) return ""
    const startMonth = dateRange.start.toLocaleDateString("en-IN", { month: "short" })
    const startDay = dateRange.start.getDate()
    
    if (!dateRange.end) return `${startMonth} ${startDay}`
    
    const endMonth = dateRange.end.toLocaleDateString("en-IN", { month: "short" })
    const endDay = dateRange.end.getDate()
    const days = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    
    return `${startMonth} ${startDay} → ${endMonth} ${endDay} · ${days} days`
  }, [mounted, dateRange])

  const seasonInfo = SEASON_INFO[currentMonth]
  const monthName = MONTH_NAMES[currentMonth]

  // Always render the same JSX shell - use suppressHydrationWarning for date-dependent text
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6">
        {/* Notes Panel */}
        <div className="lg:w-72 bg-white/80 backdrop-blur rounded-2xl p-5 shadow-lg border border-white/50 h-fit">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Monthly Notes</h3>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full" suppressHydrationWarning>
              {mounted ? `${monthName} ${currentYear}` : ""}
            </span>
          </div>
          {dateRange.start && (
            <div className="mb-3 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
              {formatRange}
            </div>
          )}
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add your notes for this month..."
            className="w-full h-36 p-3 border border-gray-200 rounded-lg resize-none text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
          />
          <button
            onClick={saveNotes}
            className="mt-3 w-full py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg font-medium text-sm hover:from-blue-600 hover:to-indigo-600 transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
          >
            {showSaved ? "Saved!" : "Save Notes"}
          </button>
        </div>

        {/* Calendar */}
        <div className="flex-1 relative">
          {/* Spiral Binding Rings */}
          <div className="absolute -top-2 left-0 right-0 flex justify-around px-8 z-20">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="w-6 h-6 bg-gradient-to-b from-gray-300 to-gray-400 rounded-full shadow-md border-2 border-gray-200 flex items-center justify-center">
                <div className="w-2 h-2 bg-gray-600 rounded-full" />
              </div>
            ))}
          </div>

          {/* Hero Image with Month Banner - visible on all screen sizes */}
          <div className="relative h-48 md:h-64 rounded-t-2xl overflow-hidden">
            <img
              src={MONTH_IMAGES[currentMonth]}
              alt={`${monthName} landscape`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            
            {/* Ribbon Banner */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <div className="relative bg-gradient-to-r from-rose-500 via-rose-400 to-rose-500 text-white px-8 py-2 font-bold text-xl md:text-2xl tracking-wide shadow-lg" suppressHydrationWarning>
                {mounted ? `${monthName} ${currentYear}` : ""}
                <div className="absolute -left-3 top-0 bottom-0 w-3 bg-rose-600 skew-y-[45deg] origin-top-right" />
                <div className="absolute -right-3 top-0 bottom-0 w-3 bg-rose-600 -skew-y-[45deg] origin-top-left" />
              </div>
            </div>

            {/* Season Badge */}
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
              <span className="text-lg">{seasonInfo.emoji}</span>
              <span className="text-sm font-medium text-gray-700">{seasonInfo.label}</span>
            </div>
          </div>

          {/* Navigation */}
          <div className="bg-white flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <button
              onClick={() => navigateMonth("prev")}
              className="p-2 rounded-full hover:bg-gray-200 active:bg-gray-300 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center group"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 group-hover:text-gray-800" />
            </button>
            
            <h2 className="text-lg font-bold text-gray-800" suppressHydrationWarning>
              {mounted ? `${monthName} ${currentYear}` : ""}
            </h2>
            
            <button
              onClick={() => navigateMonth("next")}
              className="p-2 rounded-full hover:bg-gray-200 active:bg-gray-300 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center group"
              aria-label="Next month"
            >
              <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-gray-800" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className={`bg-white rounded-b-2xl shadow-xl overflow-hidden transition-all duration-300 ${isAnimating ? (animationDirection === "left" ? "translate-x-[-10px] opacity-50" : "translate-x-[10px] opacity-50") : ""}`}>
            {/* Day Headers */}
            <div className="grid grid-cols-7 bg-gradient-to-r from-slate-50 to-gray-50">
              {DAY_NAMES.map((day, i) => (
                <div
                  key={day}
                  className={`py-3 text-center text-xs font-semibold tracking-wider ${i === 0 ? "text-rose-500" : i === 6 ? "text-blue-500" : "text-gray-500"}`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Date Grid */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, index) => {
                const holiday = getHoliday(day.date)
                const dayOfWeek = day.date.getDay()
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
                const isTodayDate = isToday(day.date)
                const inRange = isInRange(day.date)
                const rangeStart = isRangeStart(day.date)
                const rangeEnd = isRangeEnd(day.date)
                const inPreview = isInPreviewRange(day.date)
                const previewEnd = isPreviewEnd(day.date)
                const atRowStart = isRowStart(index)
                const atRowEnd = isRowEnd(index)

                // Determine if this cell should show the range band
                // Band shows through start, middle (inRange), and end dates
                const isPartOfRange = rangeStart || rangeEnd || inRange
                const isPartOfPreview = previewEnd || inPreview
                const showBand = (isPartOfRange || isPartOfPreview) && day.isCurrentMonth
                
                // Determine edge rounding: flush/square at row boundaries (Sun/Sat), rounded only at true range ends NOT on row edges
                const isFirstInBand = rangeStart || (dateRange.start && !dateRange.end && previewEnd && hoveredDate && hoveredDate < dateRange.start)
                const isLastInBand = rangeEnd || previewEnd
                
                // Row boundaries (Sunday col 0, Saturday col 6) ALWAYS get flush/square edges - no border radius
                // Rounded caps only appear at true range start/end when NOT at a row boundary
                const bandStyle: React.CSSProperties = {
                  position: 'absolute',
                  top: '4px',
                  bottom: '4px',
                  backgroundColor: '#dbeafe', // blue-100
                  // Left edge
                  left: atRowStart ? 0 : isFirstInBand ? '50%' : '-1px',
                  borderTopLeftRadius: atRowStart ? 0 : isFirstInBand ? '9999px' : 0,
                  borderBottomLeftRadius: atRowStart ? 0 : isFirstInBand ? '9999px' : 0,
                  // Right edge
                  right: atRowEnd ? 0 : isLastInBand ? '50%' : '-1px',
                  borderTopRightRadius: atRowEnd ? 0 : isLastInBand ? '9999px' : 0,
                  borderBottomRightRadius: atRowEnd ? 0 : isLastInBand ? '9999px' : 0,
                }

                return (
                  <div key={index} className="relative">
                    {/* Continuous range band - square at row edges (Sun/Sat), rounded only at true range start/end */}
                    {showBand && (
                      <div style={bandStyle} />
                    )}
                    
                    <button
                      onClick={() => day.isCurrentMonth && handleDateClick(day.date)}
                      onMouseEnter={() => day.isCurrentMonth && handleMouseEnter(day.date)}
                      onMouseLeave={handleMouseLeave}
                      disabled={!day.isCurrentMonth}
                      className={`
                        relative w-full aspect-square flex flex-col items-center justify-center
                        min-h-[40px] transition-all duration-100
                        ${!day.isCurrentMonth ? "text-gray-300 cursor-default" : "cursor-pointer"}
                        ${day.isCurrentMonth && !rangeStart && !rangeEnd && !inRange && !inPreview ? "hover:bg-gray-100 rounded-full" : ""}
                      `}
                    >
                      {/* Date circle container */}
                      <span
                        className={`
                          w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-full
                          text-sm md:text-base font-medium transition-all
                          ${isTodayDate ? "bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-md" : ""}
                          ${rangeStart || rangeEnd ? "bg-blue-500 text-white shadow-sm" : ""}
                          ${!isTodayDate && !rangeStart && !rangeEnd && day.isCurrentMonth && isWeekend ? (dayOfWeek === 0 ? "text-rose-500" : "text-blue-500") : ""}
                          ${!isTodayDate && !rangeStart && !rangeEnd && day.isCurrentMonth && !isWeekend ? "text-gray-700" : ""}
                        `}
                      >
                        {day.date.getDate()}
                      </span>
                      
                      {/* Holiday indicator */}
                      {holiday && day.isCurrentMonth && (
                        <span
                          className="absolute bottom-1 w-1.5 h-1.5 bg-orange-400 rounded-full"
                          onMouseEnter={(e) => {
                            e.stopPropagation()
                            handleHolidayHover(e, holiday)
                          }}
                          onMouseLeave={handleHolidayLeave}
                        />
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Tooltip */}
          {tooltipInfo && (
            <div
              className="fixed z-50 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full"
              style={{ left: tooltipInfo.x, top: tooltipInfo.y }}
            >
              {tooltipInfo.text}
              <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-full border-4 border-transparent border-t-gray-900" />
            </div>
          )}

          {/* Month Legend */}
          <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full" />
              <span className="text-gray-600">Today</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-orange-400 rounded-full" />
              <span className="text-gray-600">Holiday</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-3 bg-blue-100 rounded-full" />
              <span className="text-gray-600">Selected Range</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
