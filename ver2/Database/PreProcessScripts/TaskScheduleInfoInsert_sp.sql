CREATE PROCEDURE [dbo].TaskScheduleInfoInsert_sp
	@ID uniqueidentifier, 
	@TaskHistoryID uniqueidentifier = null,
	@PeriodStartTime datetime = null,
	@PeriodEndTime datetime = null,
	@NextOccurrenceTime datetime = null,
	@RecurrenceType smallint = null,
	@Interval smallint = null,
	@DayOfWeekMask smallint = null,
	@DayOfMonth smallint = null,
	@Instance tinyint = null,
	@MonthOfYear smallint = null,
	@HourlyStartTime datetime = null,
	@HourlyEndTime datetime = null
AS 
	SET NOCOUNT ON
	INSERT INTO TaskSchedule 
		(
			[ID], [TaskHistoryID], [PeriodStartTime], [PeriodEndTime], [NextOccurrenceTime],
			[RecurrenceType], [Interval], [DayOfWeekMask], [DayOfMonth], [Instance],
			[MonthOfYear], [HourlyStartTime], [HourlyEndTime] 
		)
		VALUES
		(
			@ID, @TaskHistoryID, @PeriodStartTime, @PeriodEndTime, @NextOccurrenceTime,
			@RecurrenceType, IsNull(@Interval, 0), IsNull(@DayOfWeekMask, 0), IsNull(@DayOfMonth, 0),
			IsNull(@Instance, 0), IsNull(@MonthOfYear, 0), IsNull(@HourlyStartTime, dbo.GetMaxDate()),
			IsNull(@HourlyEndTime, dbo.GetMaxDate()) 
		)
	
		UPDATE TaskHistory 
		SET 
			ScheduleVersion = ScheduleVersion + 1
		WHERE ID = @TaskHistoryID