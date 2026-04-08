"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { ChevronLeft, ChevronRight, Save, Check } from "lucide-react"

// Indian public holidays data
const INDIAN_HOLIDAYS: Record<string, { name: string; dates: number[] }[]> = {
  "0": [{ name: "Republic Day", dates: [26] }],
  "2": [{ name: "Holi", dates: [25] }],
  "3": [{ name: "Good Friday", dates: [18] }],
  "7": [{ name: "Independence Day", dates: [15] }, { name: "Janmashtami", dates: [26] }],
  "8": [{ name: "Gandhi Jayanti", dates: [2] }],
  "9": [{ name: "Dussehra", dates: [12] }, { name: "Diwali", dates: [31] }],
  "10": [{ name: "Diwali", dates: [1] }, { name: "Guru Nanak Jayanti", dates: [15] }],
  "11": [{ name: "Christmas", dates: [25] }],
}

// Season icons based on month
const SEASON_INFO: Record<number, { icon: string; label: string }> = {
  0: { icon: "❄️", label: "Winter" },
  1: { icon: "❄️", label: "Winter" },
  2: { icon: "🌸", label: "Spring" },
  3: { icon: "🌸", label: "Spring" },
  4: { icon: "🌸", label: "Spring" },
  5: { icon: "☀️", label: "Summer" },
  6: { icon: "🌧️", label: "Monsoon" },
  7: { icon: "🌧️", label: "Monsoon" },
  8: { icon: "🌧️", label: "Monsoon" },
  9: { icon: "🍂", label: "Autumn" },
  10: { icon: "🍂", label: "Autumn" },
  11: { icon: "❄️", label: "Winter" },
}

// Hero images for each month (using Unsplash)
const MONTH_IMAGES: Record<number, string> = {
  0: "https://images.unsplash.com/photo-1483664852095-d6cc6870702d?w=1200&h=600&fit=crop",
  1: "https://images.unsplash.com/photo-1457269449834-928af64c684d?w=1200&h=600&fit=crop",
  2: "https://images.unsplash.com/photo-1462275646964-a0e3571f4f97?w=1200&h=600&fit=crop",
  3: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=1200&h=600&fit=crop",
  4: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1200&h=600&fit=crop",
  5: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=600&fit=crop",
  6: "https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=1200&h=600&fit=crop",
  7: "https://images.unsplash.com/photo-1499002238440-d264f3c1f3f5?w=1200&h=600&fit=crop",
  8: "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=1200&h=600&fit=crop",
  9: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=600&fit=crop",
  10: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1200&h=600&fit=crop",
  11: "https://images.unsplash.com/photo-1482517967863-00e15c9b44be?w=1200&h=600&fit=crop",
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

interface DateRange {
  start: Date | null
  end: Date | null
}

export default function WallCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [dateRange, setDateRange] = useState<DateRange>({ start: null, end: null })
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null)
  const [notes, setNotes] = useState("")
  const [savedNotes, setSavedNotes] = useState<Record<string, string>>({})
  const [isAnimating, setIsAnimating] = useState(false)
  const [animationDirection, setAnimationDirection] = useState<"left" | "right">("right")
  const [showSaved, setShowSaved] = useState(false)
  const [tooltipInfo, setTooltipInfo] = useState<{ x: number; y: number; text: string } | null>(null)

  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()
  const today = new Date()

  // Load notes from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("calendarNotes")
    if (stored) {
      setSavedNotes(JSON.parse(stored))
    }
  }, [])

  // Load notes for current month
  useEffect(() => {
    const key = `${currentYear}-${currentMonth}`
    setNotes(savedNotes[key] || "")
  }, [currentMonth, currentYear, savedNotes])

  const saveNotes = useCallback(() => {
    const key = `${currentYear}-${currentMonth}`
    const updated = { ...savedNotes, [key]: notes }
    setSavedNotes(updated)
    localStorage.setItem("calendarNotes", JSON.stringify(updated))
    setShowSaved(true)
    setTimeout(() => setShowSaved(false), 2000)
  }, [currentMonth, currentYear, notes, savedNotes])

  const navigateMonth = useCallback((direction: "prev" | "next") => {
    setIsAnimating(true)
    setAnimationDirection(direction === "next" ? "right" : "left")
    
    setTimeout(() => {
      setCurrentDate((prev) => {
        const newDate = new Date(prev)
        if (direction === "prev") {
          newDate.setMonth(prev.getMonth() - 1)
        } else {
          newDate.setMonth(prev.getMonth() + 1)
        }
        return newDate
      })
      setIsAnimating(false)
    }, 300)
  }, [])

  const getDaysInMonth = useCallback((year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }, [])

  const getFirstDayOfMonth = useCallback((year: number, month: number) => {
    return new Date(year, month, 1).getDay()
  }, [])

  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth)
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth)
    const daysInPrevMonth = getDaysInMonth(currentYear, currentMonth - 1)
    
    const days: { date: Date; isCurrentMonth: boolean }[] = []
    
    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i
      days.push({
        date: new Date(currentYear, currentMonth - 1, day),
        isCurrentMonth: false,
      })
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(currentYear, currentMonth, i),
        isCurrentMonth: true,
      })
    }
    
    // Next month days
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(currentYear, currentMonth + 1, i),
        isCurrentMonth: false,
      })
    }
    
    return days
  }, [currentMonth, currentYear, getDaysInMonth, getFirstDayOfMonth])

  const handleDateClick = useCallback((date: Date) => {
    if (!dateRange.start || (dateRange.start && dateRange.end)) {
      setDateRange({ start: date, end: null })
    } else {
      if (date < dateRange.start) {
        setDateRange({ start: date, end: dateRange.start })
      } else {
        setDateRange({ start: dateRange.start, end: date })
      }
    }
    setHoveredDate(null)
  }, [dateRange])

  const isInRange = useCallback((date: Date, start: Date | null, end: Date | null) => {
    if (!start || !end) return false
    const time = date.getTime()
    return time > start.getTime() && time < end.getTime()
  }, [])

  const isStartDate = useCallback((date: Date) => {
    return dateRange.start && date.toDateString() === dateRange.start.toDateString()
  }, [dateRange.start])

  const isEndDate = useCallback((date: Date) => {
    return dateRange.end && date.toDateString() === dateRange.end.toDateString()
  }, [dateRange.end])

  const isToday = useCallback((date: Date) => {
    return date.toDateString() === today.toDateString()
  }, [today])

  const getHoliday = useCallback((date: Date) => {
    const month = date.getMonth().toString()
    const day = date.getDate()
    const holidays = INDIAN_HOLIDAYS[month]
    if (!holidays) return null
    
    for (const holiday of holidays) {
      if (holiday.dates.includes(day)) {
        return holiday.name
      }
    }
    return null
  }, [])

  const getPreviewRange = useCallback(() => {
    if (!dateRange.start || dateRange.end || !hoveredDate) return { start: null, end: null }
    
    if (hoveredDate < dateRange.start) {
      return { start: hoveredDate, end: dateRange.start }
    }
    return { start: dateRange.start, end: hoveredDate }
  }, [dateRange, hoveredDate])

  const previewRange = getPreviewRange()

  const handleMouseEnter = useCallback((date: Date, event: React.MouseEvent) => {
    setHoveredDate(date)
    const holiday = getHoliday(date)
    if (holiday) {
      const rect = (event.target as HTMLElement).getBoundingClientRect()
      setTooltipInfo({
        x: rect.left + rect.width / 2,
        y: rect.top,
        text: holiday,
      })
    }
  }, [getHoliday])

  const handleMouseLeave = useCallback(() => {
    setHoveredDate(null)
    setTooltipInfo(null)
  }, [])

  const seasonInfo = SEASON_INFO[currentMonth]

  return (
    <div className="min-h-screen bg-[#fafaf8] p-4 md:p-8">
      {/* Tooltip */}
      {tooltipInfo && (
        <div
          className="fixed z-50 px-3 py-1.5 text-sm bg-gray-900 text-white rounded-lg shadow-lg transform -translate-x-1/2 -translate-y-full pointer-events-none"
          style={{ left: tooltipInfo.x, top: tooltipInfo.y - 8 }}
        >
          {tooltipInfo.text}
          <div className="absolute left-1/2 -translate-x-1/2 top-full border-4 border-transparent border-t-gray-900" />
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Notes Panel - Desktop: Left side, Mobile: Bottom */}
          <div className="order-2 lg:order-1 lg:w-1/4">
            <div className="bg-white rounded-2xl shadow-lg p-6 h-full">
              <h2 className="font-serif text-xl text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-[#1a73e8] rounded-full" />
                Monthly Notes
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Write your notes for this month..."
                className="w-full h-48 lg:h-64 p-4 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/20 focus:border-[#1a73e8] text-gray-700 placeholder:text-gray-400 transition-all"
              />
              <button
                onClick={saveNotes}
                className="mt-4 w-full flex items-center justify-center gap-2 bg-[#1a73e8] text-white py-3 px-4 rounded-xl hover:bg-[#1557b0] transition-colors font-medium"
              >
                {showSaved ? (
                  <>
                    <Check className="w-5 h-5" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Notes
                  </>
                )}
              </button>
              
              {/* Selected Range Info */}
              {dateRange.start && (
                <div className="mt-6 p-4 bg-[#1a73e8]/5 rounded-xl">
                  <p className="text-sm font-medium text-gray-700 mb-2">Selected Range</p>
                  <p className="text-sm text-gray-600">
                    {dateRange.start.toLocaleDateString("en-IN", { 
                      day: "numeric", 
                      month: "short", 
                      year: "numeric" 
                    })}
                    {dateRange.end && (
                      <>
                        {" → "}
                        {dateRange.end.toLocaleDateString("en-IN", { 
                          day: "numeric", 
                          month: "short", 
                          year: "numeric" 
                        })}
                      </>
                    )}
                  </p>
                  {dateRange.end && (
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)) + 1} days
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Calendar Panel */}
          <div className="order-1 lg:order-2 lg:w-3/4">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {/* Spiral Binding */}
              <div className="bg-gradient-to-b from-gray-100 to-gray-50 h-8 flex items-center justify-center gap-4 border-b border-gray-200">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 shadow-inner flex items-center justify-center"
                  >
                    <div className="w-3 h-3 rounded-full bg-[#fafaf8] shadow-sm" />
                  </div>
                ))}
              </div>

              {/* Hero Image */}
              <div
                className={`relative h-48 md:h-64 lg:h-72 overflow-hidden transition-all duration-300 ${
                  isAnimating
                    ? animationDirection === "right"
                      ? "-translate-x-4 opacity-0"
                      : "translate-x-4 opacity-0"
                    : "translate-x-0 opacity-100"
                }`}
              >
                <img
                  src={MONTH_IMAGES[currentMonth]}
                  alt={`${MONTH_NAMES[currentMonth]} landscape`}
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                
                {/* Month Banner */}
                <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6">
                  <div className="bg-[#1a73e8] text-white px-6 py-3 transform -skew-x-6 shadow-lg">
                    <div className="transform skew-x-6">
                      <h1 className="font-serif text-2xl md:text-4xl font-bold tracking-wide">
                        {MONTH_NAMES[currentMonth]}
                      </h1>
                      <p className="text-sm md:text-base opacity-90">{currentYear}</p>
                    </div>
                  </div>
                </div>

                {/* Season Badge */}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-md flex items-center gap-2">
                  <span className="text-xl">{seasonInfo.icon}</span>
                  <span className="text-sm font-medium text-gray-700">{seasonInfo.label}</span>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-gray-100">
                <button
                  onClick={() => navigateMonth("prev")}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-600" />
                </button>
                <div className="text-center">
                  <p className="text-gray-600 font-medium">
                    {MONTH_NAMES[currentMonth]} {currentYear}
                  </p>
                </div>
                <button
                  onClick={() => navigateMonth("next")}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Next month"
                >
                  <ChevronRight className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              {/* Calendar Grid */}
              <div
                className={`p-4 md:p-6 transition-all duration-300 ${
                  isAnimating
                    ? animationDirection === "right"
                      ? "-translate-x-4 opacity-0"
                      : "translate-x-4 opacity-0"
                    : "translate-x-0 opacity-100"
                }`}
              >
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 mb-2">
                  {WEEKDAYS.map((day, index) => (
                    <div
                      key={day}
                      className={`text-center py-2 text-sm font-medium ${
                        index === 0 || index === 6 ? "text-[#1a73e8]" : "text-gray-500"
                      }`}
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map(({ date, isCurrentMonth }, index) => {
                    const isStart = isStartDate(date)
                    const isEnd = isEndDate(date)
                    const inRange = isInRange(date, dateRange.start, dateRange.end)
                    const inPreviewRange = !dateRange.end && isInRange(date, previewRange.start, previewRange.end)
                    const isPreviewStart = !dateRange.end && previewRange.start && date.toDateString() === previewRange.start.toDateString()
                    const isPreviewEnd = !dateRange.end && previewRange.end && date.toDateString() === previewRange.end.toDateString()
                    const isTodayDate = isToday(date)
                    const holiday = getHoliday(date)
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6

                    return (
                      <button
                        key={index}
                        onClick={() => isCurrentMonth && handleDateClick(date)}
                        onMouseEnter={(e) => isCurrentMonth && handleMouseEnter(date, e)}
                        onMouseLeave={handleMouseLeave}
                        disabled={!isCurrentMonth}
                        className={`
                          relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm md:text-base font-medium transition-all
                          ${!isCurrentMonth ? "text-gray-300 cursor-default" : "cursor-pointer hover:bg-gray-50"}
                          ${isCurrentMonth && isWeekend ? "text-[#1a73e8]" : ""}
                          ${isCurrentMonth && !isWeekend && !isStart && !isEnd ? "text-gray-700" : ""}
                          ${inRange || inPreviewRange ? "bg-[#1a73e8]/10" : ""}
                          ${isStart || isEnd ? "bg-[#1a73e8] text-white hover:bg-[#1557b0]" : ""}
                          ${isPreviewStart || isPreviewEnd ? "bg-[#1a73e8]/50 text-white" : ""}
                          ${isTodayDate && !isStart && !isEnd ? "ring-2 ring-[#1a73e8] ring-offset-1" : ""}
                        `}
                      >
                        <span className={isStart || isEnd ? "relative z-10" : ""}>
                          {date.getDate()}
                        </span>
                        {holiday && isCurrentMonth && (
                          <span className="absolute bottom-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Legend */}
                <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-[#1a73e8]" />
                    <span>Selected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-[#1a73e8]/10 border border-[#1a73e8]/30" />
                    <span>In Range</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded ring-2 ring-[#1a73e8]" />
                    <span>Today</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-white border border-gray-200 flex items-center justify-center">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                    </div>
                    <span>Holiday</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
