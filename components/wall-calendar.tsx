"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

// Indian Public Holidays (hardcoded)
const INDIAN_HOLIDAYS: Record<string, string> = {
  "2026-01-26": "Republic Day",
  "2026-03-10": "Holi",
  "2026-04-02": "Good Friday",
  "2026-04-06": "Ram Navami",
  "2026-04-14": "Ambedkar Jayanti",
  "2026-05-01": "May Day",
  "2026-08-15": "Independence Day",
  "2026-08-19": "Janmashtami",
  "2026-10-02": "Gandhi Jayanti",
  "2026-10-20": "Dussehra",
  "2026-11-07": "Diwali",
  "2026-11-08": "Diwali Holiday",
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

  // Memoized calendar days calculation
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
    
    // Next month days to fill the grid (6 rows)
    const remainingDays = 42 - days.length
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

  const handleDateClick = useCallback((date: Date) => {
    if (!dateRange.start || dateRange.end) {
      setDateRange({ start: date, end: null })
    } else {
      if (date < dateRange.start) {
        setDateRange({ start: date, end: dateRange.start })
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

  const formatRange = useMemo(() => {
    if (!mounted || !dateRange.start) return ""
    const startStr = dateRange.start.toLocaleDateString("en-IN", { 
      day: "numeric", month: "short", year: "numeric" 
    })
    if (!dateRange.end) return `From: ${startStr}`
    const endStr = dateRange.end.toLocaleDateString("en-IN", { 
      day: "numeric", month: "short", year: "numeric" 
    })
    const days = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    return `${startStr} - ${endStr} (${days} days)`
  }, [mounted, dateRange])

  const seasonInfo = SEASON_INFO[currentMonth]
  const monthName = MONTH_NAMES[currentMonth]

  // Always render the same JSX shell - use suppressHydrationWarning for date-dependent text
  return (
    <div className="min-h-screen bg-[#fafaf8] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Notes Panel - Fixed 280px on desktop, stacked below on mobile */}
          <div className="order-2 lg:order-1 w-full lg:w-[280px] lg:flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 h-full">
              <h2 className="text-lg font-semibold text-gray-800 mb-1">Notes</h2>
              <p className="text-sm text-gray-500 mb-4" suppressHydrationWarning>
                {mounted ? `${monthName} ${currentYear}` : ""}
              </p>
              
              {dateRange.start && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700" suppressHydrationWarning>
                  {formatRange}
                </div>
              )}
              
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add your notes for this month..."
                className="w-full h-40 p-3 border border-gray-200 rounded-lg resize-none text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              
              <button
                onClick={saveNotes}
                className="mt-3 w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors min-h-[44px]"
              >
                {showSaved ? "Saved!" : "Save Notes"}
              </button>
            </div>
          </div>

          {/* Calendar */}
          <div className="order-1 lg:order-2 flex-1">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Spiral Binding Rings */}
              <div className="h-6 bg-gray-100 flex items-center justify-center gap-6 md:gap-8 border-b border-gray-200">
                {Array.from({ length: 11 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-4 h-4 rounded-full bg-gray-300 border-2 border-gray-400 shadow-inner"
                  />
                ))}
              </div>

              {/* Hero Image with Month Banner */}
              <div 
                className={`relative h-48 md:h-64 overflow-hidden transition-all duration-300 ease-in-out ${
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
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                
                {/* Diagonal Banner */}
                <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6">
                  <div className="bg-blue-600 text-white px-6 py-2 transform -skew-x-6 shadow-lg">
                    <span className="inline-block skew-x-6 font-serif text-xl md:text-2xl font-semibold tracking-wide" suppressHydrationWarning>
                      {mounted ? `${monthName} ${currentYear}` : ""}
                    </span>
                  </div>
                </div>

                {/* Season Badge */}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md flex items-center gap-2">
                  <span className="text-base">{seasonInfo.emoji}</span>
                  <span className="text-xs font-medium text-gray-700">{seasonInfo.label}</span>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-gray-100">
                <button
                  onClick={() => navigateMonth("prev")}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                
                <span className="text-sm font-medium text-gray-600" suppressHydrationWarning>
                  {mounted ? `${monthName} ${currentYear}` : ""}
                </span>
                
                <button
                  onClick={() => navigateMonth("next")}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Next month"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="p-4 md:p-6">
                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
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
                  className={`grid grid-cols-7 gap-1 transition-all duration-300 ease-in-out ${
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

                    return (
                      <button
                        key={index}
                        onClick={() => day.isCurrentMonth && handleDateClick(day.date)}
                        onMouseEnter={() => day.isCurrentMonth && handleMouseEnter(day.date)}
                        onMouseLeave={handleMouseLeave}
                        disabled={!day.isCurrentMonth}
                        className={`
                          relative aspect-square flex flex-col items-center justify-center
                          min-h-[44px] rounded-lg transition-all duration-150
                          ${!day.isCurrentMonth ? "text-gray-300 cursor-default" : "cursor-pointer hover:bg-gray-50"}
                          ${day.isCurrentMonth && isWeekend && !rangeStart && !rangeEnd ? "text-blue-600" : ""}
                          ${day.isCurrentMonth && !isWeekend && !rangeStart && !rangeEnd && !inRange ? "text-gray-700" : ""}
                          ${inRange ? "bg-blue-100" : ""}
                          ${inPreview || previewEnd ? "bg-blue-50" : ""}
                          ${rangeStart || rangeEnd ? "bg-blue-600 text-white" : ""}
                          ${isTodayDate && !rangeStart && !rangeEnd ? "ring-2 ring-blue-600 ring-offset-1" : ""}
                        `}
                      >
                        <span className="text-sm font-medium">{day.date.getDate()}</span>
                        {holiday && day.isCurrentMonth && (
                          <span
                            className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-red-500"
                            onMouseEnter={(e) => handleHolidayHover(e, holiday)}
                            onMouseLeave={handleHolidayLeave}
                          />
                        )}
                      </button>
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
          className="fixed z-50 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{ left: tooltipInfo.x, top: tooltipInfo.y }}
        >
          {tooltipInfo.text}
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  )
}
