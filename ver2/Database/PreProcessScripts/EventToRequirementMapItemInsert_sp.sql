CREATE PROCEDURE EventToRequirementMapItemInsert_sp
	@EventLogID uniqueidentifier,
	@RequirementID uniqueidentifier
AS
	SET NOCOUNT ON	

	INSERT INTO [EventToReqMap]
	(
		[EventLogID],
		[RequirementID]
	)
	VALUES
	(
		@EventLogID, 
		@RequirementID
	)