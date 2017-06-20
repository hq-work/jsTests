IF OBJECT_ID('CalcRequirementContainerInsert_sp', 'P') IS NOT NULL
	DROP PROCEDURE CalcRequirementContainerInsert_sp;

declare @sqlString nvarchar(max);	
SET @sqlString ='
CREATE PROCEDURE dbo.CalcRequirementContainerInsert_sp
		@ID uniqueidentifier,
		@ScriptID uniqueidentifier = NULL,
		@UOM nvarchar(50) = NULL,
		@LowLimit float = NULL,
		@HighLimit float = NULL,
		@LimiTOP int = NULL,
		@IntLowLimit float = NULL,
		@IntHighLimit float = NULL,
		@Script nvarchar(max) = NULL,
		@TemplateID uniqueidentifier = NULL,
		@DescriptiON nvarchar(3000) = NULL,
		@PeriodFreq int = NULL,
		@PeriodTime nvarchar(30) = NULL,
		@Title3 nvarchar(80) = NULL,
		@Name nvarchar(255) = NULL,
		@ParentID uniqueidentifier = NULL,
		@CreateDate datetime = NULL,
		@ActivateDate datetime = NULL,
		@DeactivateDate datetime = NULL,
		@CalcDESC nvarchar(1000) = NULL,
		@UdfTemplateID uniqueidentifier = NULL,
		@PrecisiON int = NULL,
		@EventNotificationType int = NULL,
		@RegTaskTemplateID uniqueidentifier = NULL,
		@IntTaskTemplateID uniqueidentifier = NULL,
		@ResponsibleUserID uniqueidentifier = NULL,
		@CalcTemplateID uniqueidentifier = NULL

AS 

	SET NOCOUNT ON

	DECLARE @error int
	
	exec @error = RequirementInsert_sp
		@ID = @ID,
		@TemplateID = @TemplateID,
		@Description = @Description,
		@PeriodFreq = @PeriodFreq,
		@PeriodTime = @PeriodTime,
		@Title3 = @Title3,
		@Name = @Name,
		@ParentID = @ParentID,
		@CreateDate = @CreateDate,
		@ActivateDate = @ActivateDate,
		@DeactivateDate = @DeactivateDate,
		@RequirementType = ''C'',
		@UdfTemplateID = @UdfTemplateID,
		@EventNotificationType = @EventNotificationType,
		@ResponsibleUserID=@ResponsibleUserID,
		@CalcTemplateID=@CalcTemplateID
		
	IF @error <> 0
		GOTO errorHandler
		
	INSERT INTO CalculatedRequirement 
		(
			[ID],
			[UOM],
			[CalcDesc],
			[Precision],
			[RegTaskTemplateID],
			[IntTaskTemplateID] 
		) 
	VALUES(
			@ID,
			isnull(@UOM, ''''),
			isnull(@CalcDesc, ''''),
			isnull(@Precision, 2147483647),
			nullif(@RegTaskTemplateID, 0x0),
			nullif(@IntTaskTemplateID, 0x0));
		

	DECLARE @Timestamp DATETIME;
	SET @Timestamp = GETUTCDATE();

	INSERT INTO RequirementScript(ID, RequirementID, Script, BeginDate, EndDate, Created, RowTimestamp)
	SELECT ID, RequirementID, Script, BeginDate, EndDate,  @Timestamp, @Timestamp
	FROM #Scripts;

	INSERT INTO RequirementDependency(ScriptID, RequirementID, Created, RowTimestamp)
	SELECT ScriptID, RequirementID, @Timestamp, @Timestamp
	FROM #Scripts_Requirements;

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
return @error;'
EXEC (@sqlString);


