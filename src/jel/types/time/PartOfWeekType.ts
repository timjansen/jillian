enum PartOfWeekType {
  SUNDAY = 1,
  MONDAY = 1 << 2,
  TUESDAY = 1 << 3,
  WEDNESDAY = 1 << 4,
  THURSDAY = 1 << 5,
  FRIDAY = 1 << 6,
  SATURDAY = 1 << 7,
    
  WEEKEND = SUNDAY + SATURDAY,
  BUSINESS_DAY = MONDAY + TUESDAY + WEDNESDAY + THURSDAY + FRIDAY
}

export default PartOfWeekType;