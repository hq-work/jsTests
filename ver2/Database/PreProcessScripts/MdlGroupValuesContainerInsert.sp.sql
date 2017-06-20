IF OBJECT_ID('MdlGroupValuesContainerInsert_sp', 'P') IS NOT NULL
	DROP PROCEDURE MdlGroupValuesContainerInsert_sp;

declare @sqlString nvarchar(max);	
SET @sqlString =
'CREATE PROCEDURE MdlGroupValuesContainerInsert_sp
	@ParentID uniqueidentifier
	, @ActivityID uniqueidentifier
AS
BEGIN
	DECLARE @Timestamp DATETIME;
	SET @Timestamp = GETUTCDATE();

	INSERT MDLGroup (
		ID
		, ParentID
		, ActivityID
		, Complete
		, Collector
		, Created
		, RowTimestamp
	)
	SELECT ID
		, ParentID
		, ActivityID
		, Complete
		, Collector
		, @Timestamp
		, @Timestamp
	  FROM #Groups;

	INSERT MaterialDataLine (
		ID
		, MDLGroupID
		, MaterialID
		, StartTime
		, EndTime
		, Created
		, RowTimestamp
	)
	SELECT ID
		, MDLGroupID
		, MaterialID
		, StartTime
		, EndTime
		, @Timestamp
		, @Timestamp
	  FROM #Groups_DataLines;

	INSERT MaterialData (
		DataLineID
		, PropertyID
		, Value
		, Created
		, RowTimestamp
	)
	SELECT DataLineID
		, PropertyID
		, Value
		, @Timestamp
		, @Timestamp
	  FROM #Groups_DataLines_Data;
END;';
EXEC (@sqlString);