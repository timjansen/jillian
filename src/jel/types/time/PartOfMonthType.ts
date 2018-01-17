enum PartOfMonthType {
  SUNDAY = 0,    // to get the nth Sunday of the month
  MONDAY,
  TUESDAY,
  WEDNESDAY,
  THURSDAY,
  FRIDAY,
  SATURDAY,
    
  LAST_SUNDAY = 10, // to get the last Sunday
  LAST_MONDAY,
  LAST_TUESDAY,
  LAST_WEDNESDAY,
  LAST_THURSDAY,
  LAST_FRIDAY,
  LAST_SATURDAY,
    
  WEEKEND = 20,    // to get the nth weekend of the month
  LAST_WEEKEND,
  
  WEEK,            // the nth week of the month
  LAST_WEEK,       // last week of the month..LAST_WEEK
    
  HALF, 
  THIRD
}

export default PartOfMonthType;