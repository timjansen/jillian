enum PartOfDayType {
  NIGHT, // 18:00-6:00
  DAYTIME, // 6:00-18:00
  MORNING, // 5:00-12:00
  AFTERNOON, // 12:00-18:00
  EVENING, // 18:00-00:00
  EARLY_MORNING, // 4:00-8:00
  PRIME_TIME, // 19:00-22:00 (west) or 20:00-23:00
  AFTER_MIDNIGHT, // 00:00-6:00
  BEFORE_NOON // 9:00-12:00
}

export default PartOfDayType;