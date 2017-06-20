CREATE PROCEDURE EventPropertyValueInsert_sp
	@ID uniqueidentifier,
	@InstanceID uniqueidentifier,
	@PropertyID uniqueidentifier,
	@Value sql_variant
AS
	SET NOCOUNT ON

	INSERT INTO [EventPropertyData]
	(
		[ID],
		[InstanceID],
		[PropertyID],
		[Value],
		[RowTimestamp],
		[Created],
		EventTemplateID
	)
	SELECT
		@ID,
		@InstanceID,
		@PropertyID,
		@Value,
		GetUTCDate(),
		GetUTCDate(),
		el.EventTemplateID
	FROM
		EventInstance ei, EventLog el
	WHERE
		ei.ID = @InstanceID
		AND ei.EventLogID = el.ID