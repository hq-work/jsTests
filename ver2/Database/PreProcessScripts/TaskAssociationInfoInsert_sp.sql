CREATE PROCEDURE TaskAssociationInfoInsert_sp
	@TaskHistoryID UNIQUEIDENTIFIER
AS
	SET NOCOUNT ON

	DELETE FROM u FROM UserTask u
	WHERE EXISTS (SELECT 1 FROM #UserAssignees a WHERE a.ID = u.UserID )
		AND u.TaskHistoryID = @TaskHistoryID

	INSERT INTO UserTask(TaskHistoryID, UserID)
	SELECT @TaskHistoryID, a.ID FROM #UserAssignees a
	
	DELETE FROM g FROM GroupTask g
	WHERE EXISTS (SELECT 1 FROM #GroupAssignees a WHERE a.ID = g.GroupID)
		AND g.TaskHistoryID = @TaskHistoryID
	
	INSERT INTO GroupTask(TaskHistoryID, GroupID)
	SELECT @TaskHistoryID, a.ID FROM #GroupAssignees a
	
	DELETE FROM t FROM TaskObject t
	WHERE EXISTS (SELECT 1 FROM #Objects o WHERE o.ID = t.ObjectID)
		AND t.TaskHistoryID = @TaskHistoryID
		
	INSERT INTO TaskObject(TaskHistoryID, ObjectID)
	SELECT @TaskHistoryID, o.ID FROM #Objects o