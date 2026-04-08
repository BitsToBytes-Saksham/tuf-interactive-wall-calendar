"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
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
  useEffect(() => {
    if (!mounted) return
    const key = `${currentYear}-${currentMonth}`
    setNotes(savedNotes[key] || "")
  }, [currentMonth, currentYear, mounted, savedNotes])

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
    <div className="min-h-screen bg-[#f8f7f4] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Notes Panel */}
          <div className="order-2 lg:order-1 w-full lg:w-[260px] lg:flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sticky top-8">
              <h2 className="text-base font-semibold text-gray-800 mb-1">Monthly Notes</h2>
              <p className="text-xs text-gray-500 mb-4" suppressHydrationWarning>
                {mounted ? `${monthName} ${currentYear}` : ""}
              </p>
              
              {dateRange.start && (
                <div className="mb-3 px-3 py-2 bg-blue-50 rounded-lg text-sm text-blue-700 font-medium" suppressHydrationWarning>
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
                className="mt-3 w-full py-2.5 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors min-h-[44px]"
              >
                {showSaved ? "Saved!" : "Save Notes"}
              </button>
            </div>
          </div>

          {/* Calendar */}
          <div className="order-1 lg:order-2 flex-1">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Spiral Binding Rings */}
              <div className="h-5 bg-gradient-to-b from-gray-100 to-gray-50 flex items-center justify-center gap-8 border-b border-gray-200">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-3.5 h-3.5 rounded-full bg-gradient-to-b from-gray-200 to-gray-400 border border-gray-300 shadow-sm"
                  />
                ))}
              </div>

              {/* Hero Image with Month Banner - visible on all screen sizes */}
              <div 
                className={`relative h-40 sm:h-44 md:h-56 overflow-hidden transition-all duration-300 ease-in-out ${
                  isAnimating 
                    ? animationDirection === "left" 
                      ? "-translate-x-8 opacity-0" 
                      : "translate-x-8 opacity-0"
                    : "translate-x-0 opacity-100"
                }`}
              >
                <img
                  src={MONTH_IMAGES[currentMonth]}
                  alt={`${monthName} landscape`}
                  className="w-full h-full object-cover block"
                  crossOrigin="anonymous"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
                
                {/* Ribbon Banner */}
                <div style={{ position: 'absolute', bottom: '16px', left: '0', clipPath: 'polygon(0 0, 100% 0, calc(100% - 20px) 100%, 0 100%)', backgroundColor: '#1d4ed8', padding: '10px 40px 10px 20px' }}>
                  <span style={{ fontFamily: 'serif', fontSize: '1.75rem', fontWeight: 'bold', color: 'white' }} suppressHydrationWarning>
                    {mounted ? `${monthName} ${currentYear}` : ""}
                  </span>
                </div>

                {/* Season Badge */}
                <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
                  <span className="text-sm">{seasonInfo.emoji}</span>
                  <span className="text-xs font-medium text-gray-700">{seasonInfo.label}</span>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between px-4 md:px-6 py-2.5 border-b border-gray-100 bg-gray-50/50">
                <button
                  onClick={() => navigateMonth("prev")}
                  className="p-2 rounded-full hover:bg-gray-200 active:bg-gray-300 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center group"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-500 group-hover:text-gray-700" />
                </button>
                
                <span className="text-sm font-semibold text-gray-700" suppressHydrationWarning>
                  {mounted ? `${monthName} ${currentYear}` : ""}
                </span>
                
                <button
                  onClick={() => navigateMonth("next")}
                  className="p-2 rounded-full hover:bg-gray-200 active:bg-gray-300 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center group"
                  aria-label="Next month"
                >
                  <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-gray-700" />
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="p-3 md:p-5">
                {/* Day Headers */}
                <div className="grid grid-cols-7 mb-1">
                  {DAY_NAMES.map((day, i) => (
                    <div
                      key={day}
                      className={`text-center text-xs font-semibold py-2 ${
                        i === 0 || i === 6 ? "text-blue-600" : "text-gray-500"
                      }`}
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Date Grid */}
                <div 
                  className={`grid grid-cols-7 transition-all duration-300 ease-in-out ${
                    isAnimating 
                      ? animationDirection === "left" 
                        ? "-translate-x-8 opacity-0" 
                        : "translate-x-8 opacity-0"
                      : "translate-x-0 opacity-100"
                  }`}
                >
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
                      <div
                        key={index}
                        className="relative"
                      >
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
                              w-8 h-8 md:w-9 md:h-9 flex items-center justify-center text-sm font-medium rounded-full
                              transition-all duration-100
                              ${rangeStart || rangeEnd ? "bg-blue-600 text-white" : ""}
                              ${previewEnd && !rangeStart ? "bg-blue-400 text-white" : ""}
                              ${isTodayDate && !rangeStart && !rangeEnd ? "ring-2 ring-blue-600" : ""}
                              ${day.isCurrentMonth && isWeekend && !rangeStart && !rangeEnd && !previewEnd ? "text-blue-600" : ""}
                              ${day.isCurrentMonth && !isWeekend && !rangeStart && !rangeEnd && !previewEnd ? "text-gray-800" : ""}
                              ${!day.isCurrentMonth ? "text-gray-300" : ""}
                            `}
                          >
                            {day.date.getDate()}
                          </span>
                          
                          {/* Holiday indicator */}
                          {holiday && day.isCurrentMonth && (
                            <span
                              className="absolute bottom-0.5 w-1.5 h-1.5 rounded-full bg-red-500 cursor-help"
                              onMouseEnter={(e) => {
                                e.stopPropagation()
                                handleHolidayHover(e, holiday)
                              }}
                              onMouseLeave={(e) => {
                                e.stopPropagation()
                                handleHolidayLeave()
                              }}
                            />
                          )}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Holiday Tooltip */}
      {tooltipInfo && (
        <div
          className="fixed z-50 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full whitespace-nowrap"
          style={{ left: tooltipInfo.x, top: tooltipInfo.y }}
        >
          {tooltipInfo.text}
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  )
}
