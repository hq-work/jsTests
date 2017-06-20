CREATE PROCEDURE WorkflowInstanceStepInfoInsert_sp
	@ID UNIQUEIDENTIFIER,
	@WorkflowInstanceID UNIQUEIDENTIFIER,
	@WorkflowDefinitionVersionStepID UNIQUEIDENTIFIER,
	@CompletedDate DATETIME
AS
	SET NOCOUNT ON
	
	INSERT INTO WorkflowInstanceStep (ID, WorkflowInstanceID, WorkflowDefinitionVersionStepID, CompletedDate)
	VALUES (@ID, @WorkflowInstanceID, @WorkflowDefinitionVersionStepID, @CompletedDate)
	
	IF EXISTS (SELECT 1 FROM WorkflowInstance WHERE ID = @WorkflowInstanceID)
	BEGIN
		UPDATE WorkflowInstance
			SET CurrentStepID = @ID
		WHERE ID = @WorkflowInstanceID
	END


