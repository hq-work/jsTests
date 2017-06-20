IF OBJECT_ID('TbCalculatedRequirementEntityInsert_sp', 'P') IS NOT NULL
	DROP PROCEDURE TbCalculatedRequirementEntityInsert_sp;

declare @sqlString nvarchar(max);	
SET @sqlString ='
CREATE PROCEDURE TbCalculatedRequirementEntityInsert_sp
	@ID uniqueidentifier,	
	@UOM varchar(50) = NULL,
	@TemplateID uniqueidentifier = NULL,
	@Description varchar(3000) = NULL,
	@PeriodFreq int = NULL,
	@PeriodTime varchar(30) = NULL,
	@Title3 varchar(80) = NULL,
	@Name varchar(255) = NULL,
	@ParentID uniqueidentifier = NULL,
	@CreateDate datetime = NULL,
	@ActivateDate datetime = NULL,
	@DeactivateDate datetime = NULL,
	@CalcDesc varchar(1000) = NULL,
	@UdfTemplateID uniqueidentifier = NULL,
	@Precision int = NULL,
	@EventNotificationType int = NULL,
	@MissingDataPercent int = NULL,
	@RegTaskTemplateID uniqueidentifier = NULL,
	@IntTaskTemplateID uniqueidentifier = NULL,
	@ResponsibleUserID uniqueidentifier = NULL,
	@CalcTemplateID uniqueidentifier = NULL,
	@IsRolling bit
AS
	EXEC TBCalculatedParamReqInsert_sp 
		@ID=@ID,
		@UOM=@UOM,
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
		@CalcDesc=@CalcDesc,
		@UdfTemplateID=@UdfTemplateID,
		@Precision=@Precision,
		@EventNotificationType=@EventNotificationType,
		@MissingDataPercent=@MissingDataPercent,
		@RegTaskTemplateID=@RegTaskTemplateID,
		@IntTaskTemplateID=@IntTaskTemplateID,
		@ResponsibleUserID=@ResponsibleUserID,
		@CalcTemplateID=@CalcTemplateID,
		@IsRolling = @IsRolling;

	-- Inserting Scripts
	IF OBJECT_ID(''tempdb..#Scripts'') IS NOT NULL
	BEGIN
		-- RequirementScript table
		INSERT INTO RequirementScript 
		(
			[ID],
			[RequirementID],
			[Script],
			[BeginDate],
			[EndDate]
		)
		SELECT
			[ID],
			[RequirementID],
			[Script],
			[BeginDate],
			[EndDate]
		FROM #Scripts;

		-- TBCRequirementScript table
		INSERT INTO TBCRequirementScript
		(
			ID, 
			IntermediatePeriodType, 
			TBPeriodType, 
			TBPeriodDuration
		)
		SELECT 
			ID, 
			IntermediatePeriodType, 
			TBPeriodType, 
			TBPeriodDuration
		FROM #Scripts;
		
		-- Inserting Script Dependencies
		if OBJECT_ID(''tempdb..#Scripts_Requirements'') IS NOT NULL
		BEGIN
			INSERT INTO RequirementDependency
			(
				ScriptID,
				RequirementID
			)
			SELECT 
				ScriptID, 
				RequirementID 
			FROM #Scripts_Requirements;
		END;
	END;

	return @@error;'
EXEC (@sqlString);
