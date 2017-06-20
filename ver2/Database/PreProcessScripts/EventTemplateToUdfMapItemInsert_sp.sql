CREATE PROCEDURE EventTemplateToUdfMapItemInsert_sp
	@ID uniqueidentifier,
	@TemplateID uniqueidentifier,
	@PropertyID uniqueidentifier,	
	@Order int,
	@LastEnteredValue bit,
	@Precision int
	
AS
	SET NOCOUNT ON

	INSERT INTO [EventTemplateToUdfMap]
	(
		[ID],
		[TemplateID],
		[PropertyID],
		[Order],
		[LastEnteredValue],
		[Precision]
	)
	VALUES
	(
		@ID,
		@TemplateID,
		@PropertyID,
		@Order,
		@LastEnteredValue,
		@Precision
	)