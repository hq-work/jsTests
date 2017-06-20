CREATE PROCEDURE ComplianceObjectTaskTemplateInfoInsert_sp
	@LimitType char(1),
	@Assignor uniqueidentifier
AS
	SET NOCOUNT ON

	DELETE FROM a FROM ComplianceObjectTaskTemplateAssignor a
	WHERE EXISTS (SELECT 1 FROM #Objects t WHERE t.ID = a.ObjectID)
		AND a.LimitType = @LimitType
		
	INSERT INTO ComplianceObjectTaskTemplateAssignor(ObjectID, LimitType, UserID)
	SELECT t.ID, @LimitType, @Assignor FROM #Objects t
	
	DELETE FROM a FROM ComplianceObjectTaskTemplateUser a
	WHERE EXISTS (SELECT 1 FROM #Objects t WHERE t.ID = a.ObjectID)
		AND a.LimitType = @LimitType
		
	INSERT INTO ComplianceObjectTaskTemplateUser(ObjectID, LimitType, UserID)
	SELECT t.ID, @LimitType, u.ID FROM #Objects t, #UserAssignees u
	
	DELETE FROM a FROM ComplianceObjectTaskTemplateGroup a
	WHERE EXISTS (SELECT 1 FROM #Objects t WHERE t.ID = a.ObjectID)
		AND a.LimitType = @LimitType
		
	INSERT INTO ComplianceObjectTaskTemplateGroup(ObjectID, LimitType, GroupID)
	SELECT t.ID, @LimitType, g.ID FROM #Objects t, #GroupAssignees g