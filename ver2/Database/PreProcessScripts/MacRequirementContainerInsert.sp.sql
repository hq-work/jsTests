IF OBJECT_ID('MacRequirementContainerInsert_sp', 'P') IS NOT NULL
	DROP PROCEDURE MacRequirementContainerInsert_sp;

declare @sqlString nvarchar(max);	
SET @sqlString =
'CREATE PROCEDURE MacRequirementContainerInsert_sp
 	@ID uniqueidentifier,
	@TemplateID uniqueidentifier = NULL, 
	@RequirementType char(1) = NULL, 
	@Description nvarchar(3000) = NULL, 
	@PeriodFreq int = NULL,
	@PeriodTime nvarchar(30) = NULL, 
	@Title3 nvarchar(80) = NULL, 
	@Name nvarchar(255) = NULL, 
	@ParentID uniqueidentifier = NULL, 
	@CreateDate datetime = NULL, 
	@ActivateDate datetime = NULL, 
	@DeactivateDate datetime = NULL,
 	@UdfTemplateID uniqueidentifier = NULL,
	@UOM nvarchar(50) = NULL,
	@Precision int = NULL,
	@CalcDESC nvarchar(1000) = NULL,
	@ActivityID uniqueidentifier = NULL,
	@EventNotificationType int = NULL,
	@RegTaskTemplateID uniqueidentifier = NULL,
	@IntTaskTemplateID uniqueidentifier = NULL,
	@MACType tinyint = NULL,
	@AggregationOp tinyint = NULL,
	@ResponsibleUserID uniqueidentifier = NULL,
	@CalcTemplateID uniqueidentifier = NULL
AS
BEGIN
	SET NOCOUNT ON;
	DECLARE @errOR int;
	EXEC @error = RequirementInsert_sp
			@ID=@ID,
			@TemplateID=@TemplateID, 
			@Description=@Description, 
			@PeriodFreq=@PeriodFreq, 
			@PeriodTime=@PeriodTime, 
			@Title3=@Title3, 
			@Name=@Name, 
			@ParentID=@ParentID, 
			@CreateDate=@CreateDate, 
			@ActivateDate=@ActivateDate, 
			@DeactivateDate=@DeactivateDate,
			@RequirementType=''M'',
			@UdfTemplateID=@UdfTemplateID,
			@EventNotificationType=@EventNotificationType,
			@ResponsibleUserID=@ResponsibleUserID,
			@CalcTemplateID=@CalcTemplateID;
	IF @error <> 0
		GOTO errorHandler;
		
	INSERT INTO MACRequirement
	(
		[ID],
		[UOM], 
		[CalcDesc],
		[Precision],
		[ActivityID],
		[RegTaskTemplateID],
		[IntTaskTemplateID],
		[MACType],
		[AggregationOp]		
	)
	values
	(
		@ID,
		isnull(@UOM, ''''), 
		isnull(@CalcDesc, ''''),
		isnull(@Precision, 2147483647),
		isnull(@ActivityID, ''00000000-0000-0000-0000-000000000000''),
		nullif(@RegTaskTemplateID, 0x0),
		nullif(@IntTaskTemplateID, 0x0),
		isnull(@MACType, 0),
		isnull(@AggregationOp, 0)
	);

	DECLARE @Timestamp DATETIME;
	SET		@Timestamp = GETUTCDATE();

	INSERT INTO MaterialFormulaHistory(ID, ParentID, RequirementID, PropertyID, BeginDate, EndDate, Script,  Created, RowTimestamp, Exception)
	SELECT mfh.ID, mfh.ParentID, mfh.RequirementID, NULL, mfh.BeginDate, mfh.EndDate, mfh.Script,  @Timestamp, @Timestamp, mfh.Exception
	FROM #Scripts mfh;


	INSERT INTO MACReqToMaterialMap(MACReqID, MaterialID, MaterialGroupID, Created, RowTimestamp)
	SELECT m.ContainerID, m.MaterialID, m.MaterialGroupID, @Timestamp, @Timestamp
	FROM #Materials m;

	SET @error = @@error;		
	errorHandler:
		return @error;

END';
EXEC (@sqlString);