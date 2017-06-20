CREATE PROCEDURE TaskTemplateWorkflowTriggerAssociationInfoInsert_sp
	@TaskTemplateWorkflowTriggerID UNIQUEIDENTIFIER
AS
	SET NOCOUNT ON

	DELETE FROM u FROM TaskTemplateWorkflowTriggerUser u
	WHERE EXISTS (SELECT 1 FROM #UserAssignees a WHERE a.ID = u.UserID )
		AND u.TaskTemplateWorkflowTriggerID = @TaskTemplateWorkflowTriggerID

	INSERT INTO TaskTemplateWorkflowTriggerUser(TaskTemplateWorkflowTriggerID, UserID)
	SELECT @TaskTemplateWorkflowTriggerID, a.ID FROM #UserAssignees a
	
	DELETE FROM g FROM TaskTemplateWorkflowTriggerGroup g
	WHERE EXISTS (SELECT 1 FROM #GroupAssignees a WHERE a.ID = g.GroupID)
		AND g.TaskTemplateWorkflowTriggerID = @TaskTemplateWorkflowTriggerID
	
	INSERT INTO TaskTemplateWorkflowTriggerGroup(TaskTemplateWorkflowTriggerID, GroupID)
	SELECT @TaskTemplateWorkflowTriggerID, a.ID FROM #GroupAssignees a