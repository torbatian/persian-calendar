const LEAP_YEAR_BREAKS = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178]

/**
 * @typedef {Object} jalaaliCalendarInfo
 * @property {number} leap number of years since the last leap year (0 to 4)
 * @property {number} gregorianYear Gregorian year of the beginning of Jalaali year
 * @property {number} march the March day of Farvardin the 1st (1st day of jalaaliYear)
 */
/**
 * Determines if the Jalaali (Persian) year is leap (366-day long) or is the common year (365 days), and finds the day in March (Gregorian calendar) of the first day of the Jalaali year (Jy)
 * @param {number} jalaaliYear jalaali calendar year (-6 - 3177)
 * @returns {jalaaliCalendarInfo}
 */
function jalaaliCalendarInfo (jalaaliYear) {
  if (jalaaliYear < LEAP_YEAR_BREAKS[0] || jalaaliYear >= LEAP_YEAR_BREAKS[20]) {
    throw new Error(`invalid jalaali year ${jalaaliYear}`)
  }

  const gregorianYear = jalaaliYear + 621
  let leapJalaali = -14
  let breakPoint = LEAP_YEAR_BREAKS[0]
  let jumpYearBreak

  // Find the limiting years for the Jalaali year jalaaliYear
  for (let index = 1; index < LEAP_YEAR_BREAKS.length; index++) {
    const leapYearBreak = LEAP_YEAR_BREAKS[index]
    jumpYearBreak = leapYearBreak - breakPoint
    if (jalaaliYear < leapYearBreak) {
      break
    }
    leapJalaali = leapJalaali + Math.trunc(jumpYearBreak / 33) * 8 + Math.trunc(jumpYearBreak % 33 / 4)
    breakPoint = leapYearBreak
  }

  let yearsPast = jalaaliYear - breakPoint

  // Find the number of leap years from AD 621 to the beginning of the current Jalaali year in the Persian calendar
  leapJalaali = leapJalaali + Math.trunc(yearsPast / 33) * 8 + Math.trunc((yearsPast % 33 + 3) / 4)
  if (jumpYearBreak % 33 === 4 && jumpYearBreak - 1 === 4) {
    leapJalaali += 1
  }

  // and the same in the Gregorian calendar (until the year gregorianYear)
  const leapGregorian = Math.trunc(gregorianYear / 4) - Math.trunc((Math.trunc(gregorianYear / 100) + 1) * 3 / 4) - 150

  // Determine the Gregorian date of Farvardin the 1st
  const march = 20 + leapJalaali - leapGregorian

  // Find how many years have passed since the last leap year
  if (jumpYearBreak - yearsPast < 6) {
    yearsPast = yearsPast - jumpYearBreak + Math.trunc((jumpYearBreak + 4) / 33) * 33
  }
  let leap = ((yearsPast + 1) % 33 - 1) % 4
  leap = leap === -1 ? 4 : leap

  return {
    leap,
    gregorianYear,
    march
  }
}

/**
 * Converts a date of the Jalaali calendar to the Julian Day Number
 * @param {number} jalaaliYear Jalaali year (1 to 3100)
 * @param {number} jalaaliMonth Jalaali month (1 to 12)
 * @param {number} jalaaliDay Jalaali day (1 to 29/31)
 * @returns {number} the Julian Day Number
 */
function jalaaliToJulianDay (jalaaliYear, jalaaliMonth, jalaaliDay) {
  const jalaaliCalendar = jalaaliCalendar(jalaaliYear)
  return (
    gregorianJulianToJulianDay(jalaaliCalendar.year, 3, jalaaliCalendar.march) +
    (jalaaliMonth - 1) * 31 -
    Math.trunc(jalaaliMonth / 7) * (jalaaliMonth - 7) +
    jalaaliDay -
    1
  )
}

/**
 * @typedef {Object} jalaaliCalendar
 * @property {number} year Jalaali year (1 to 3100)
 * @property {number} month Jalaali month (1 to 12)
 * @property {number} day Jalaali day (1 to 29/31)
 */
/**
 * Converts the Julian Day number to a date in the Jalaali calendar
 * @param {number} julianDay the Julian Day number
 * @returns {jalaaliCalendar}
 */
function julianDayToJalaali (julianDay) {
  const { year } = julianDayToGregorianJulian(julianDay)
  let jalaaliYear = year - 621
  const jalaaliCal = jalaaliCalendarInfo(jalaaliYear)
  const julian1stFarvardin = gregorianJulianToJulianDay(year, 3, jalaaliCal.march)
  let jalaaliMonth
  let jalaaliDay

  let pastDays = julianDay - julian1stFarvardin
  if (pastDays >= 0) {
    if (pastDays <= 185) {
      jalaaliMonth = 1 + Math.trunc(pastDays / 31)
      jalaaliDay = pastDays % 31 + 1
      return {
        year: jalaaliYear,
        month: jalaaliMonth,
        day: jalaaliDay
      }
    }
    pastDays -= 186
  } else {
    jalaaliYear -= 1
    pastDays += 179
    if (jalaaliCal.leap === 1) {
      pastDays += 1
    }
  }

  jalaaliMonth = 7 + Math.trunc(pastDays / 30)
  jalaaliDay = pastDays % 30 + 1

  return {
    year: jalaaliYear,
    month: jalaaliMonth,
    day: jalaaliDay
  }
}

/**
 * Calculates the Julian Day number from Gregorian or Julian calendar dates.
 * The procedure was tested to be good since 1 March, -100100 (of both the calendars) up to a few millions (10**6) years into the future.
 * The algorithm is based on D.A. Hatcher, Q.Jl.R.Astron.Soc. 25(1984), 53-55 slightly modified by K.M. Borkowski, Post.Astron. 25(1987), 275-279
 * @param {number} year calendar year (years BC numbered 0, -1, -2, ...)
 * @param {number} month calendar month (for January M=1, February M=2, ..., M=12)
 * @param {number} day calendar day of the month M (1 to 28/29/30/31)
 * @param {string} calendar calendar type (gregorian or julian)
 * @returns {number} This integer number corresponds to the noon of the date (i.e. 12 hours of Universal Time).
 */
function gregorianJulianToJulianDay (year, month, day, calendar = 'gregorian') {
  let julianDay =
    Math.trunc((year + Math.trunc((month - 8) / 6) + 100100) * 1461 / 4) + Math.trunc((153 * ((month + 9) % 12) + 2) / 5) + day - 34840408

  if (calendar === 'gregorian') {
    julianDay = julianDay - Math.trunc(Math.trunc((year + 100100 + Math.trunc((month - 8) / 6)) / 100) * 3 / 4) + 752
  }

  return julianDay
}

/**
 * @typedef {Object} GregorianJulianCalendar
 * @property {number} year Calendar year (years BC numbered 0, -1, -2, ...)
 * @property {number} month Calendar month (for January month=1, February month=2, ... month=12)
 * @property {number} day Calendar day (1 to 28/29/30/31)
 * @property {string} calendar calendar type (gregorian or julian)
 */
/**
 *
 * @param {number} julianDay Julian Day number
 * @param {string} calendar calendar type (gregorian or julian)
 * @returns {GregorianJulianCalendar}
 */
function julianDayToGregorianJulian (julianDay, calendar = 'gregorian') {
  let julian = 4 * julianDay + 139361631
  if (calendar === 'gregorian') {
    julian = julian + Math.trunc(Math.trunc((4 * julianDay + 183187720) / 146097) * 3 / 4) * 4 - 3908
  }

  const i = Math.trunc(julian % 1461 / 4) * 5 + 308
  const day = Math.trunc(i % 153 / 5) + 1
  const month = Math.trunc(i / 153) % 12 + 1
  const year = Math.trunc(julian / 1461) - 100100 + Math.trunc((8 - month) / 6)

  return { year, month, day, calendar }
}

/**
 * Converts date in gregorian calendar to jalaali calendar
 * @param {number | Date} year Gregorian year or Date object
 * @param {number | undefined} month Gregorian month
 * @param {number | undefined} day Gregorian day
 * @returns {jalaaliCalendar}
 */
function gregorianToJalaali (year, month, day) {
  if (year instanceof Date) {
    day = year.getDate()
    month = year.getMonth() + 1
    year = year.getFullYear()
  }
  return julianDayToJalaali(gregorianJulianToJulianDay(year, month, day, 'gregorian'))
}

/**
 * Converts jalaali calendar to gregorian calendar
 * @param {number} year Jalaali year
 * @param {number} month Jalaali month
 * @param {number} day Jalaali day
 * @returns {GregorianJulianCalendar}
 */
function jalaaliToGregorian (year, month, day) {
  return julianDayToGregorianJulian(jalaaliToJulianDay(year, month, day), 'gregorian')
}

export {
  gregorianToJalaali,
  jalaaliToGregorian
}
