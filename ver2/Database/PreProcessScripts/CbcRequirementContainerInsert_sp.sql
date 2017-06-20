IF OBJECT_ID('CbcRequirementContainerInsert_sp', 'P') IS NOT NULL
	DROP PROCEDURE CbcRequirementContainerInsert_sp;

declare @sqlString nvarchar(max);	
SET @sqlString =
'CREATE PROCEDURE dbo.CbcRequirementContainerInsert_sp
	@ID uniqueidentifier,
	@UOM nvarchar(50) = NULL, 
	@TemplateID uniqueidentifier = NULL, 
	@Description nvarchar(3000) = NULL, 
	@PeriodFreq int = NULL, 
	@PeriodTime nvarchar(30) = NULL, 
	@Title3 nvarchar(80) = NULL, 
	@Name nvarchar(255) = NULL, 
	@ParentID uniqueidentifier = NULL, 
	@CreateDate datetime = NULL, 
	@ActivateDate datetime = NULL, 
	@DeactivateDate datetime = NULL,	
	@CalcDesc nvarchar(1000) = NULL,
	@UdfTemplateID uniqueidentifier = NULL,		
	@Precision int = NULL,
	@EventNotificationType int = NULL,
	@RegTaskTemplateID uniqueidentifier = NULL,
	@IntTaskTemplateID uniqueidentifier = NULL,
	@OldObjectName nvarchar (max) = Null,
	@ResponsibleUserID uniqueidentifier = NULL,
	@CalcTemplateID uniqueidentifier = NULL
AS
	SET NOCOUNT ON
	
	declare @error int
	exec @error=RequirementInsert_sp
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
		@RequirementType=''X'',
		@UdfTemplateID=@UdfTemplateID,
		@EventNotificationType=@EventNotificationType,
		@ResponsibleUserID=@ResponsibleUserID,
		@CalcTemplateID=@CalcTemplateID
	if @error <> 0
		goto errorHandler
		
	insert into CalculatedRequirement (
		[ID],
		[UOM], 
		[CalcDesc],
		[Precision],
		[RegTaskTemplateID],
		[IntTaskTemplateID]
	)
	values (
		@ID,
		isnull(@UOM, ''''), 
		isnull(@CalcDesc, ''''),
		isnull(@Precision, 2147483647),
		nullif(@RegTaskTemplateID, 0x0),
		nullif(@IntTaskTemplateID, 0x0)
	)
	
	DECLARE @Timestamp DATETIME;
	SET @Timestamp = GETUTCDATE();

	INSERT INTO CountBasedCalculationHistory(ID, ParentID, BaseRequirementId,  RequiredDataCount, AggregationType, BeginDate, EndDate, Created, RowTimestamp)
	SELECT ID, ParentID, BaseRequirementId, RequiredDataCount, AggregationType, BeginDate, EndDate,  @Timestamp, @Timestamp
	FROM #Intervals;

	INSERT RequirementLimit (
		   ID
		 , RequirementID
		 , LimitCreated
		 , LimitBeginDate
		 , LimitEndDate
		 , LowLimit
		 , HighLimit
		 , IntLowLimit
		 , IntHighLimit
		 , LimitOp
		 , ChemicalID
		 , ChemicalListID
		 , IntChemicalListID
	)
	SELECT ID
		 , RequirementID
		 , LimitCreated
		 , LimitBeginDate
		 , LimitEndDate
		 , LowLimit
		 , HighLimit
		 , IntLowLimit
		 , IntHighLimit
		 , LimitOp
		 , CASE WHEN ChemicalID != ''00000000-0000-0000-0000-000000000000'' THEN ChemicalID ELSE NULL END
		 , CASE WHEN ChemicalListID != ''00000000-0000-0000-0000-000000000000'' THEN ChemicalListID ELSE NULL END
		 , CASE WHEN IntChemicalListID != ''00000000-0000-0000-0000-000000000000'' THEN IntChemicalListID ELSE NULL END
	  FROM #CalcLimits;

	SET @error = @@error 

	IF @error <> 0
		GOTO errorHandler 

errorHandler: 
return @error'
EXEC (@sqlString);

