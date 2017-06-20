CREATE PROCEDURE UdfTemplateToUdfMapInsert_sp
(
	@UDFID				uniqueidentifier,
	@GroupID			uniqueidentifier,
	@Order				int
)
AS
	SET NOCOUNT ON

	INSERT INTO UdfTemplateToUdfMap (
		UDFID,
		GroupID,
		[Order],
		Created
	) VALUES (
		@UDFID,
		@GroupID,
		@Order,
		GetDate()
	)