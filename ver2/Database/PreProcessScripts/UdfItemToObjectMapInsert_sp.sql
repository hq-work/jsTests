CREATE PROCEDURE UdfItemToObjectMapInsert_sp
	@ID						UNIQUEIDENTIFIER,
	@UdfID					UNIQUEIDENTIFIER,
	@UdfItemID				UNIQUEIDENTIFIER,
	@ObjectID				UNIQUEIDENTIFIER,
	@Order					INT,
	@BeginDate				DATETIME,
	@EndDate				DATETIME
AS
	SET NOCOUNT ON

	INSERT UdfValue (
		ID,
		UdfID,
		ObjectID,
		BeginDate,
		EndDate,
		LargeTextValue
	)
	VALUES(
		@ID,
		@UdfID,
		@ObjectId,
		@BeginDate,
		@EndDate,
		@UdfItemId
	)

	INSERT UdfValueToUdfItemMap (
		UdfValueId,
		UdfItemId,
		[Order]
	)
	VALUES (
		@ID,
		@UdfItemId,
		@Order
	)