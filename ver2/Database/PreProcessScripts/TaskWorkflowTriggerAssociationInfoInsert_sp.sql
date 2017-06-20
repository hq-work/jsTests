CREATE PROCEDURE TaskWorkflowTriggerAssociationInfoInsert_sp
	@TaskWorkflowTriggerID UNIQUEIDENTIFIER
AS
	SET NOCOUNT ON

	DELETE FROM u FROM TaskWorkflowTriggerUser u
	WHERE EXISTS (SELECT 1 FROM #UserAssignees a WHERE a.ID = u.UserID )
		AND u.TaskWorkflowTriggerID = @TaskWorkflowTriggerID

	INSERT INTO TaskWorkflowTriggerUser(TaskWorkflowTriggerID, UserID)
	SELECT @TaskWorkflowTriggerID, a.ID FROM #UserAssignees a
	
	DELETE FROM g FROM TaskWorkflowTriggerGroup g
	WHERE EXISTS (SELECT 1 FROM #GroupAssignees a WHERE a.ID = g.GroupID)
		AND g.TaskWorkflowTriggerID = @TaskWorkflowTriggerID
	
	INSERT INTO TaskWorkflowTriggerGroup(TaskWorkflowTriggerID, GroupID)
	SELECT @TaskWorkflowTriggerID, a.ID FROM #GroupAssignees a