CREATE PROCEDURE ActivityUdfDataToUdfItemMapInsert_sp
	@ActivityID uniqueidentifier,
	@UdfID uniqueidentifier,
	@BeginDate datetime,
	@EndDate datetime,
	@UdfItemID uniqueidentifier,
	@Order int
AS
	SET NOCOUNT ON

	IF EXISTS (SELECT 1 FROM ActivityUDFData ad WHERE ad.ActivityID = @ActivityID AND ad.UdfID = @UdfID AND ad.BeginDate = @BeginDate)
	BEGIN
		INSERT INTO ActivityUdfDataToUdfItemMap(ActivityID, UdfID, BeginDate, EndDate, UDFItemID, [Order])
		VALUES (@ActivityID, @UdfID, @BeginDate, @EndDate, @UdfItemID, @Order)

		DECLARE @LargeTextValue nvarchar(max)
		SET @LargeTextValue = ''
		SELECT @LargeTextValue = @LargeTextValue + '/' + CAST(adi.UDFItemID AS nvarchar(40))
		FROM ActivityUdfDataToUdfItemMap adi
		WHERE adi.ActivityID = @ActivityID AND adi.UdfID = @UdfID AND adi.BeginDate = @BeginDate
		ORDER BY adi.[Order]
		UPDATE ActivityUDFData SET LargeTextValue = RIGHT(LOWER(@LargeTextValue), LEN(@LargeTextValue) - 1)
		WHERE ActivityID = @ActivityID AND UdfID = @UdfID AND BeginDate = @BeginDate
	END
	ELSE
	BEGIN
		INSERT INTO ActivityUDFData(ActivityID, UdfID, BeginDate, EndDate, LargeTextValue)
		VALUES (@ActivityID, @UdfID, @BeginDate, @EndDate, LOWER(CAST(@UdfItemID AS nvarchar(40))))

		INSERT INTO ActivityUdfDataToUdfItemMap(ActivityID, UdfID, BeginDate, EndDate, UDFItemID, [Order])
		VALUES (@ActivityID, @UdfID, @BeginDate, @EndDate, @UdfItemID, @Order)
	END