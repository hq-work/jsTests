CREATE PROCEDURE CommandLogFullInsert_sp
	@ID UNIQUEIDENTIFIER,
	@Description VARCHAR(200),
	@Issued DATETIME = NULL,
	@StartedProcessing DATETIME = NULL,
	@FinishedProcessing DATETIME = NULL,
	@StatusCode TINYINT,
	@UserID UNIQUEIDENTIFIER,
	@ObjectID UNIQUEIDENTIFIER,
	@ObjectPath VARCHAR(4095),
	@MessageType TINYINT,
	@ErrorMessage VARCHAR(2000),
	@SerializedMessage VARCHAR(2000),
	@ProcessMode TINYINT,
	@ResubmitOnFailure BIT
AS
	SET NOCOUNT ON

	EXEC CommandLogInsert_sp
			@ID = @ID,
			@Description = @Description,
			@StatusCode = @StatusCode,
			@UserID = @UserID,
			@ObjectID = @ObjectID,
			@ObjectPath = @ObjectPath,
			@Issued = @Issued,
			@StartedProcessing = @StartedProcessing,
			@MessageType = @MessageType,
			@ProcessMode = @ProcessMode,
			@ResubmitOnFailure = @ResubmitOnFailure

	UPDATE CommandLog
		SET FinishedProcessing = @FinishedProcessing
			,ErrorMessage = ISNULL(@ErrorMessage, '')
			,SerializedMessage = ISNULL(@SerializedMessage, '')
	WHERE ID = @ID