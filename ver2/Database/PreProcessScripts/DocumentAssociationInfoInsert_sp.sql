CREATE PROCEDURE DocumentAssociationInfoInsert_sp
	@DocumentID UNIQUEIDENTIFIER
AS
	SET NOCOUNT ON

	DELETE FROM d FROM DocumentObjectMapping d
	WHERE EXISTS (SELECT 1 FROM #Objects o WHERE o.ID = d.ObjectID)
		AND d.DocumentID = @DocumentID

		
	INSERT INTO DocumentObjectMapping(DocumentID, ObjectID)
	SELECT @DocumentID, o.ID FROM #Objects o
	
	DELETE FROM d FROM DocumentTaskMapping d
	WHERE EXISTS (SELECT 1 FROM #Tasks t WHERE t.ID = d.TaskHistoryID)
		AND d.DocumentID = @DocumentID
		
	INSERT INTO DocumentTaskMapping(DocumentID, TaskHistoryID)
	SELECT @DocumentID, t.ID FROM #Tasks t

	DELETE FROM d FROM DocumentTaskTemplateMapping d
	WHERE EXISTS (SELECT 1 FROM #TaskTemplates t WHERE t.ID = d.TaskTemplateID)
		AND d.DocumentID = @DocumentID
		
	INSERT INTO DocumentTaskTemplateMapping(DocumentID, TaskTemplateID)
	SELECT @DocumentID, t.ID FROM #TaskTemplates t

	DELETE FROM wid FROM WorkflowInstanceDocument wid
	WHERE EXISTS (SELECT 1 FROM #Workflows w WHERE w.ID = wid.WorkflowInstanceID)
		AND wid.DocumentID = @DocumentID
		
	INSERT INTO WorkflowInstanceDocument(DocumentID, WorkflowInstanceID)
	SELECT @DocumentID, w.ID FROM #Workflows w