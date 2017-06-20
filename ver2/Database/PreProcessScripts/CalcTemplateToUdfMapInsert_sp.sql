IF OBJECT_ID('CalcTemplateToUdfMapInsert_sp', 'P') IS NOT NULL
	DROP PROCEDURE CalcTemplateToUdfMapInsert_sp;

declare @sqlString nvarchar(max);	
SET @sqlString =
'CREATE PROCEDURE CalcTemplateToUdfMapInsert_sp
	@ID uniqueidentifier,
	@TemplateID uniqueidentifier,
	@PropertyID uniqueidentifier,	
	@Order int,
	@Created datetime
AS
	SET NOCOUNT ON;

	INSERT INTO CalcTemplateToUdfMap
	(
		[ID],
		[TemplateID],
		[PropertyID],
		[Order],
		[Created]
	)
	VALUES
	(
		@ID,
		@TemplateID,		
		@PropertyID,
		@Order,
		GetDate()
	);';
EXEC (@sqlString);