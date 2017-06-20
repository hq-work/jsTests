CREATE PROCEDURE ActivityUdfDataInsert_sp
	@ActivityID uniqueidentifier,
	@UdfID uniqueidentifier,
	@BeginDate datetime,
	@EndDate datetime,
	@Value sql_variant,
	@LargeTextValue nvarchar(max)
AS
	SET NOCOUNT ON

	INSERT ActivityUDFData (
		ActivityID,
		UdfID,
		BeginDate,
		EndDate,
		Value,
		LargeTextValue
	)
	VALUES(
		@ActivityID,
		@UdfID,
		@BeginDate,
		@EndDate,
		@Value,
		@LargeTextValue
	)